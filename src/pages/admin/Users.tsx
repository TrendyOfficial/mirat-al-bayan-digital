import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserWithRoles {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  user_roles: { role: 'admin' | 'editor' | 'author' }[];
}

export default function Users() {
  const { language } = useLanguage();
  const { user: currentUser, isOwner } = useAuth();
  const isArabic = language === 'ar';
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const OWNER_EMAIL = 'alaa2001218@gmail.com';
  const ownerCheck = isOwner();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Get all users who have at least one role (admin/editor/author)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (!userRoles || userRoles.length === 0) {
      setUsers([]);
      return;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(userRoles.map(ur => ur.user_id))];

    // For each user with roles, get their profile and email
    const usersWithDetails = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        // Get email using database function
        const { data: emailData } = await supabase.rpc('get_user_email_by_id', {
          user_id_param: userId
        });

        // Skip owner
        if (emailData?.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
          return null;
        }

        // Get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .eq('id', userId)
          .single();

        if (!profile) return null;

        // Get all roles for this user
        const roles = userRoles.filter(ur => ur.user_id === userId);

        return {
          ...profile,
          email: emailData || null,
          user_roles: roles as { role: 'admin' | 'editor' | 'author' }[],
        };
      })
    );

    // Filter out nulls (owner) and users without emails or roles
    const filtered = usersWithDetails.filter((u): u is UserWithRoles => 
      u !== null && u.email !== null && u.user_roles.length > 0
    );
    setUsers(filtered);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRoles.length === 0) {
      toast.error(isArabic ? 'اختر دورًا واحدًا على الأقل' : 'Select at least one role');
      return;
    }

    // Prevent adding roles to owner
    if (email.toLowerCase() === OWNER_EMAIL.toLowerCase()) {
      toast.error(isArabic ? 'لا يمكن تعديل أدوار المالك' : 'Cannot modify owner roles');
      return;
    }

    // Find user ID by email using database function
    const { data: userId, error: lookupError } = await supabase.rpc('get_user_id_by_email', {
      email_param: email
    });

    if (lookupError || !userId) {
      toast.error(isArabic ? 'المستخدم غير موجود. تأكد من تسجيل المستخدم أولاً.' : 'User not found. Make sure the user has signed up first.');
      return;
    }

    // Check if user is trying to assign admin role when they're not owner
    if (selectedRoles.includes('admin') && !ownerCheck) {
      toast.error(isArabic ? 'فقط المالك يمكنه إضافة مسؤولين' : 'Only owner can assign admin role');
      return;
    }

    // Add roles
    const roleInserts = selectedRoles.map(role => ({
      user_id: userId,
      role: role as any,
    }));

    const { error } = await supabase
      .from('user_roles')
      .insert(roleInserts);

    if (error) {
      toast.error(isArabic ? 'خطأ في الإضافة' : 'Failed to add roles', {
        description: error.message,
      });
    } else {
      toast.success(isArabic ? 'تمت الإضافة بنجاح' : 'Roles added successfully');
      
      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: currentUser?.id,
        p_action: 'Roles assigned to user',
        p_details: { target_email: email, roles: selectedRoles }
      });
      
      setIsDialogOpen(false);
      setEmail("");
      setSelectedRoles([]);
      fetchUsers();
    }
  };

  const handleRemoveRole = async (userId: string, role: 'admin' | 'editor' | 'author', userEmail: string) => {
    // Only owner can remove admin roles
    if (role === 'admin' && !ownerCheck) {
      toast.error(isArabic ? 'فقط المالك يمكنه إزالة المسؤولين' : 'Only owner can remove admin role');
      return;
    }

    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast.error(isArabic ? 'فشل الإزالة' : 'Failed to remove role');
    } else {
      toast.success(isArabic ? 'تم إزالة الدور بنجاح' : 'Role removed successfully');
      
      // Log activity
      await supabase.rpc('log_activity', {
        p_user_id: currentUser?.id,
        p_action: 'Role removed from user',
        p_details: { target_email: userEmail, removed_role: role }
      });
      
      fetchUsers();
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 hover:bg-red-600';
      case 'editor':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'author':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-arabic text-3xl font-bold">
          {isArabic ? 'إدارة المستخدمين' : 'Users Management'}
        </h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة دور' : 'Add Role'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isArabic ? 'إضافة دور لمستخدم' : 'Add Role to User'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{isArabic ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{isArabic ? 'الأدوار' : 'Roles'}</Label>
                <div className="space-y-2">
                  {ownerCheck && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id="admin"
                        checked={selectedRoles.includes('admin')}
                        onCheckedChange={() => toggleRole('admin')}
                      />
                      <Label htmlFor="admin" className="cursor-pointer">
                        {isArabic ? 'مسؤول' : 'Admin'}
                      </Label>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="editor"
                      checked={selectedRoles.includes('editor')}
                      onCheckedChange={() => toggleRole('editor')}
                    />
                    <Label htmlFor="editor" className="cursor-pointer">
                      {isArabic ? 'محرر' : 'Editor'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="author"
                      checked={selectedRoles.includes('author')}
                      onCheckedChange={() => toggleRole('author')}
                    />
                    <Label htmlFor="author" className="cursor-pointer">
                      {isArabic ? 'كاتب' : 'Author'}
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {isArabic ? 'إضافة' : 'Add'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{isArabic ? 'الاسم' : 'Name'}</TableHead>
              <TableHead>{isArabic ? 'البريد الإلكتروني' : 'Email'}</TableHead>
              <TableHead>{isArabic ? 'الأدوار' : 'Roles'}</TableHead>
              <TableHead>{isArabic ? 'الإجراءات' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {isArabic ? 'لا يوجد مستخدمون' : 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.user_roles.length === 0 ? (
                        <Badge variant="outline">{isArabic ? 'لا يوجد دور' : 'No role'}</Badge>
                      ) : (
                        user.user_roles.map((ur) => (
                          <Badge
                            key={ur.role}
                            className={getRoleBadgeColor(ur.role)}
                          >
                            {isArabic
                              ? ur.role === 'admin'
                                ? 'مسؤول'
                                : ur.role === 'editor'
                                ? 'محرر'
                                : 'كاتب'
                              : ur.role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {user.user_roles.map((ur) => (
                        <Button
                          key={ur.role}
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveRole(user.id, ur.role as any, user.email!)}
                          disabled={ur.role === 'admin' && !ownerCheck}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {isArabic ? 'إزالة' : 'Remove'} {ur.role}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
