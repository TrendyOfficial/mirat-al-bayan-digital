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
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function Users() {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const [users, setUsers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  const OWNER_EMAIL = 'alaa2001218@gmail.com';

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    // Get all users with their roles
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles (role)
      `);

    if (profiles) {
      // Get all auth users to find owner
      const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
      const ownerUser = authUsers?.find((u: any) => u.email === OWNER_EMAIL);
      
      // Filter out the owner from the list
      const filteredProfiles = profiles.filter(p => p.id !== ownerUser?.id);
      setUsers(filteredProfiles);
    }
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

    // Find user by email from auth
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const targetUser = authUsers?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      toast.error(isArabic ? 'المستخدم غير موجود. تأكد من تسجيل المستخدم أولاً.' : 'User not found. Make sure the user has signed up first.');
      return;
    }

    // Add roles
    const roleInserts = selectedRoles.map(role => ({
      user_id: targetUser.id,
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
      setIsDialogOpen(false);
      setEmail("");
      setSelectedRoles([]);
      fetchUsers();
    }
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-arabic text-3xl font-bold">
          {isArabic ? 'إدارة المستخدمين' : 'User Management'}
        </h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              {isArabic ? 'إضافة أدوار' : 'Add Roles'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isArabic ? 'إضافة أدوار لمستخدم' : 'Add Roles to User'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter user email'}
                />
              </div>

              <div className="space-y-3">
                <Label>{isArabic ? 'اختر الأدوار' : 'Select Roles'}</Label>
                {['admin', 'editor', 'author'].map((role) => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={role}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <label htmlFor={role} className="text-sm cursor-pointer">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </label>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">
                {isArabic ? 'إضافة الأدوار' : 'Add Roles'}
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
              <TableHead>{isArabic ? 'الأدوار' : 'Roles'}</TableHead>
              <TableHead>{isArabic ? 'تاريخ الانضمام' : 'Joined'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.full_name || 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {user.user_roles?.map((ur: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {ur.role}
                      </Badge>
                    ))}
                    {(!user.user_roles || user.user_roles.length === 0) && (
                      <span className="text-muted-foreground text-sm">
                        {isArabic ? 'لا توجد أدوار' : 'No roles'}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
