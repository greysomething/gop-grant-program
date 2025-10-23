import React, { useState, useEffect } from 'react';
import { NavigationMenuItem } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Menu, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react';

const DEFAULT_MENU_ITEMS = [
  { label: 'Start a Fundraiser', url: 'Home', order_index: 1, menu_type: 'main', is_active: true },
  { label: 'Find a Provider', url: 'Home', order_index: 2, menu_type: 'main', is_active: true },
  { label: 'Grant Program', url: 'Home', order_index: 3, menu_type: 'main', is_active: true },
  { label: 'Past Recipients', url: 'PastRecipients', order_index: 4, menu_type: 'dropdown', parent_item_id: 'more_menu', is_active: true },
  { label: 'FAQs', url: 'FAQs', order_index: 5, menu_type: 'dropdown', parent_item_id: 'more_menu', is_active: true },
  { label: 'Contact', url: 'Contact', order_index: 6, menu_type: 'dropdown', parent_item_id: 'more_menu', is_active: true },
  { label: 'Terms & Privacy', url: 'Terms', order_index: 7, menu_type: 'dropdown', parent_item_id: 'more_menu', is_active: true },
];

export default function NavigationMenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    label: '',
    url: '',
    order_index: 1,
    menu_type: 'main',
    is_active: true,
    target: '_self'
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      let items = await NavigationMenuItem.list('order_index');
      
      // If no items exist, create defaults
      if (items.length === 0) {
        for (const defaultItem of DEFAULT_MENU_ITEMS) {
          await NavigationMenuItem.create(defaultItem);
        }
        items = await NavigationMenuItem.list('order_index');
      }
      
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Reload to ensure we have latest data
      await loadMenuItems();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save menu items:', error);
    }
    setIsSaving(false);
  };

  const handleAddItem = async () => {
    if (!newItem.label || !newItem.url) return;
    
    try {
      await NavigationMenuItem.create(newItem);
      await loadMenuItems();
      setNewItem({
        label: '',
        url: '',
        order_index: menuItems.length + 1,
        menu_type: 'main',
        is_active: true,
        target: '_self'
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add menu item:', error);
    }
  };

  const handleUpdateItem = async (item, updates) => {
    try {
      await NavigationMenuItem.update(item.id, updates);
      await loadMenuItems();
    } catch (error) {
      console.error('Failed to update menu item:', error);
    }
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Delete "${item.label}"?`)) {
      try {
        await NavigationMenuItem.delete(item.id);
        await loadMenuItems();
      } catch (error) {
        console.error('Failed to delete menu item:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading menu items...</p>
      </div>
    );
  }

  const mainMenuItems = menuItems.filter(item => item.menu_type === 'main');
  const dropdownItems = menuItems.filter(item => item.menu_type === 'dropdown');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Menu className="w-6 h-6" />
            Navigation Menu
          </h2>
          <p className="text-gray-600">Manage your site's navigation menu items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : null}
            Save Changes
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Menu changes saved successfully! Refresh the page to see changes.
          </AlertDescription>
        </Alert>
      )}

      {/* Add New Item Form */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Add New Menu Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Label</Label>
                <Input
                  value={newItem.label}
                  onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                  placeholder="Menu item text"
                />
              </div>
              <div>
                <Label>URL/Page</Label>
                <Input
                  value={newItem.url}
                  onChange={(e) => setNewItem({...newItem, url: e.target.value})}
                  placeholder="Home, About, or https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Menu Type</Label>
                <Select value={newItem.menu_type} onValueChange={(value) => setNewItem({...newItem, menu_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Menu</SelectItem>
                    <SelectItem value="dropdown">Dropdown (More)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={newItem.order_index}
                  onChange={(e) => setNewItem({...newItem, order_index: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Target</Label>
                <Select value={newItem.target} onValueChange={(value) => setNewItem({...newItem, target: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Same Window</SelectItem>
                    <SelectItem value="_blank">New Window</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem}>Add Item</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Main Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mainMenuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-white">
                    {item.order_index}
                  </Badge>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.label}
                      {item.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                      {!item.is_active && <Badge variant="secondary">Disabled</Badge>}
                    </div>
                    <div className="text-sm text-gray-500">{item.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => handleUpdateItem(item, { is_active: checked })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dropdown Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dropdown Menu Items ("More" Menu)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dropdownItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-white">
                    {item.order_index}
                  </Badge>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {item.label}
                      {item.target === '_blank' && <ExternalLink className="w-3 h-3" />}
                      {!item.is_active && <Badge variant="secondary">Disabled</Badge>}
                    </div>
                    <div className="text-sm text-gray-500">{item.url}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => handleUpdateItem(item, { is_active: checked })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}