import { base44 } from '@/api/base44Client';
import { getCurrentPacificTime, dateStringToPacificStartOfDay, dateStringToPacificEndOfDay } from './timezone';

/**
 * Check if a cycle is currently open for submissions
 * @param {Object} cycle - The cycle object
 * @returns {boolean} - True if cycle is open
 */
export const isCycleOpen = (cycle) => {
  if (!cycle || !cycle.is_open_for_submissions) return false;
  
  const nowPT = getCurrentPacificTime();
  const startDate = dateStringToPacificStartOfDay(cycle.start_date);
  const endDate = dateStringToPacificEndOfDay(cycle.end_date);
  
  return nowPT >= startDate && nowPT <= endDate;
};

/**
 * Cancel draft-triggered sequences when application is submitted
 * @param {Object} application - The application object
 */
export const cancelDraftSequences = async (application) => {
  try {
    // Find all enrollments for this application that were triggered by draft status
    const enrollments = await base44.entities.EmailSequenceEnrollment.filter({
      application_id: application.id,
      status: 'active'
    });
    
    for (const enrollment of enrollments) {
      // Get the sequence to check if it was triggered by draft status
      const sequence = await base44.entities.EmailSequence.get(enrollment.sequence_id);
      
      if (sequence && sequence.trigger_type === 'status_change' && sequence.trigger_status === 'draft') {
        // Cancel this enrollment
        await base44.entities.EmailSequenceEnrollment.update(enrollment.id, {
          status: 'cancelled'
        });
        console.log(`Cancelled draft sequence enrollment ${enrollment.id} for application ${application.id}`);
      }
    }
  } catch (error) {
    console.error('Error cancelling draft sequences:', error);
    // Don't throw - we don't want to break the main flow
  }
};

/**
 * Automatically enroll an application into matching email sequences
 * @param {Object} application - The application object
 * @param {string} triggerType - Type of trigger ('application_submitted' or 'status_change')
 * @param {string} newStatus - The new status of the application (optional, for status_change triggers)
 */
export const enrollInMatchingSequences = async (application, triggerType, newStatus = null) => {
  try {
    // 1. Get the cycle for this application
    const cycle = await base44.entities.Cycle.get(application.cycle_id);
    
    // 2. Check if cycle is currently open
    if (!isCycleOpen(cycle)) {
      console.log(`Cycle ${cycle.name} is not open, skipping sequence enrollment`);
      return;
    }
    
    // 3. Get the user for recipient info
    const user = await base44.entities.User.get(application.user_id);
    if (!user) {
      console.error(`User not found for application ${application.id}`);
      return;
    }
    
    // 4. Find matching active sequences
    let matchingSequences = [];
    
    if (triggerType === 'application_submitted') {
      matchingSequences = await base44.entities.EmailSequence.filter({
        trigger_type: 'application_submitted',
        is_active: true
      });
    } else if (triggerType === 'status_change' && newStatus) {
      matchingSequences = await base44.entities.EmailSequence.filter({
        trigger_type: 'status_change',
        trigger_status: newStatus,
        is_active: true
      });
    }
    
    // 5. Create enrollments for each matching sequence
    for (const sequence of matchingSequences) {
      // Check if already enrolled in this sequence
      const existingEnrollments = await base44.entities.EmailSequenceEnrollment.filter({
        sequence_id: sequence.id,
        application_id: application.id
      });
      
      if (existingEnrollments.length > 0) {
        console.log(`Application ${application.id} already enrolled in sequence ${sequence.name}`);
        continue;
      }
      
      // Get the first step to calculate next_email_due_date
      const steps = await base44.entities.EmailSequenceStep.filter({ 
        sequence_id: sequence.id 
      });
      const sortedSteps = steps.sort((a, b) => a.step_number - b.step_number);
      const firstStep = sortedSteps[0];
      
      if (!firstStep) {
        console.warn(`Sequence ${sequence.name} has no steps, skipping enrollment`);
        continue;
      }
      
      // Calculate when first email should be sent
      const nextDueDate = new Date();
      nextDueDate.setDate(nextDueDate.getDate() + firstStep.delay_days);
      
      // Create enrollment
      await base44.entities.EmailSequenceEnrollment.create({
        sequence_id: sequence.id,
        sequence_name: sequence.name,
        application_id: application.id,
        recipient_email: user.email,
        recipient_name: user.full_name || `${user.first_name} ${user.last_name}`,
        current_step: 0,
        status: 'active',
        next_email_due_date: nextDueDate.toISOString(),
        enrolled_date: new Date().toISOString()
      });
      
      console.log(`Enrolled application ${application.id} in sequence ${sequence.name}`);
    }
    
  } catch (error) {
    console.error('Error enrolling in sequences:', error);
    // Don't throw error - we don't want to break the main flow
  }
};

/**
 * Check and enroll on application submission
 * @param {Object} application - The application object
 */
export const enrollOnSubmission = async (application) => {
  // First, cancel any draft sequences
  await cancelDraftSequences(application);
  
  // Then enroll in submission sequences
  await enrollInMatchingSequences(application, 'application_submitted');
};

/**
 * Check and enroll on status change
 * @param {Object} application - The application object
 * @param {string} newStatus - The new status
 * @param {string} oldStatus - The previous status (optional)
 */
export const enrollOnStatusChange = async (application, newStatus, oldStatus = null) => {
  // If changing from draft to submitted, cancel draft sequences
  if (oldStatus === 'draft' && newStatus === 'submitted') {
    await cancelDraftSequences(application);
  }
  
  await enrollInMatchingSequences(application, 'status_change', newStatus);
};

/**
 * Check and enroll on draft save
 * @param {Object} application - The application object with draft status
 */
export const enrollOnDraftSave = async (application) => {
  if (application.status === 'draft') {
    await enrollInMatchingSequences(application, 'status_change', 'draft');
  }
};