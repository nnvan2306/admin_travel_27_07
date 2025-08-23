import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useNotifier';
import { api } from '@/lib/api';
import { Edit, Plus, Trash2 } from 'lucide-react';

interface CompanyContact {
  id: number;
  address: string;
  hotline: string;
  email: string;
  website: string;
  is_deleted: string;
  created_at: string;
  updated_at: string;
}

const ContactPage = () => {
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CompanyContact | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    hotline: '',
    email: '',
    website: ''
  });
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const response = await api.get('/admin/company-contacts');
      setContacts(response.data);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách thông tin liên hệ',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContact) {
        await api.put(`/admin/company-contacts/${editingContact.id}`, formData);
        toast({
          title: 'Thành công',
          description: 'Cập nhật thông tin liên hệ thành công'
        });
      } else {
        await api.post('/admin/company-contacts', formData);
        toast({
          title: 'Thành công',
          description: 'Thêm thông tin liên hệ thành công'
        });
      }
      
      setIsDialogOpen(false);
      setEditingContact(null);
      setFormData({ address: '', hotline: '', email: '', website: '' });
      fetchContacts();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (contact: CompanyContact) => {
    setEditingContact(contact);
    setFormData({
      address: contact.address || '',
      hotline: contact.hotline || '',
      email: contact.email || '',
      website: contact.website || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông tin liên hệ này?')) return;
    
    try {
      await api.delete(`/admin/company-contacts/${id}`);
      toast({
        title: 'Thành công',
        description: 'Xóa thông tin liên hệ thành công'
      });
      fetchContacts();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Có lỗi xảy ra',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({ address: '', hotline: '', email: '', website: '' });
    setEditingContact(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý thông tin liên hệ</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm thông tin liên hệ
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Chỉnh sửa thông tin liên hệ' : 'Thêm thông tin liên hệ mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nhập địa chỉ công ty"
                />
              </div>
              <div>
                <Label htmlFor="hotline">Hotline</Label>
                <Input
                  id="hotline"
                  type="text"
                  value={formData.hotline}
                  onChange={(e) => setFormData({ ...formData, hotline: e.target.value })}
                  placeholder="Nhập số hotline"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Nhập email"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="Nhập website"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit">
                  {editingContact ? 'Cập nhật' : 'Thêm'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact) => (
          <Card key={contact.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Thông tin liên hệ #{contact.id}</span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(contact)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Địa chỉ:</Label>
                  <p className="text-sm text-gray-600">{contact.address || 'Chưa có'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Hotline:</Label>
                  <p className="text-sm text-gray-600">{contact.hotline || 'Chưa có'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email:</Label>
                  <p className="text-sm text-gray-600">{contact.email || 'Chưa có'}</p>
                </div>
                <div>
                  <Label className="font-semibold">Website:</Label>
                  <p className="text-sm text-gray-600">{contact.website || 'Chưa có'}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                <p>Trạng thái: {contact.is_deleted === 'active' ? 'Hoạt động' : 'Không hoạt động'}</p>
                <p>Cập nhật lần cuối: {new Date(contact.updated_at).toLocaleString('vi-VN')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {contacts.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500">Chưa có thông tin liên hệ nào</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ContactPage;
