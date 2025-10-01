import { useState } from "react";
import { UserPlus, Archive, ArchiveRestore, Key, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUsers, Profile } from "@/hooks/useUsers";

const Users = () => {
  const {
    users,
    isLoading,
    createUserMutation,
    updateUserMutation,
    archiveUserMutation,
    resetPasswordMutation,
  } = useUsers();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [archiveUserId, setArchiveUserId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user",
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUserMutation.mutateAsync(newUser);
    setCreateDialogOpen(false);
    setNewUser({ email: "", password: "", full_name: "", role: "user" });
  };

  const handleUpdateUser = async (id: string, field: string, value: string) => {
    await updateUserMutation.mutateAsync({ id, [field]: value });
    setEditingUser(null);
  };

  const handleArchiveUser = async (id: string, is_archived: boolean) => {
    await archiveUserMutation.mutateAsync({ id, is_archived });
    setArchiveUserId(null);
  };

  const handleResetPassword = async (userId: string) => {
    await resetPasswordMutation.mutateAsync(userId);
    setResetUserId(null);
  };

  const filteredUsers = users?.filter(u => showArchived ? u.is_archived : !u.is_archived) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zarządzanie użytkownikami</h1>
          <p className="text-muted-foreground">Twórz i zarządzaj użytkownikami systemu</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
            {showArchived ? "Pokaż aktywnych" : "Pokaż zarchiwizowanych"}
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Dodaj użytkownika
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Utwórz nowego użytkownika</DialogTitle>
                  <DialogDescription>
                    Wypełnij dane nowego użytkownika systemu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Hasło</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Imię i nazwisko</Label>
                    <Input
                      id="full_name"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rola</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Użytkownik</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Tworzenie..." : "Utwórz użytkownika"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{showArchived ? "Zarchiwizowani użytkownicy" : "Aktywni użytkownicy"}</CardTitle>
          <CardDescription>
            {filteredUsers.length} {showArchived ? "zarchiwizowanych" : "aktywnych"} użytkowników
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Imię i nazwisko</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Data utworzenia</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    {editingUser?.id === user.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingUser.full_name || ""}
                          onChange={(e) =>
                            setEditingUser({ ...editingUser, full_name: e.target.value })
                          }
                          className="h-8"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            handleUpdateUser(user.id, "full_name", editingUser.full_name || "")
                          }
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingUser(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {user.full_name || "Nie podano"}
                        {!showArchived && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "Administrator" : "Użytkownik"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!showArchived && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResetUserId(user.id)}
                        >
                          <Key className="mr-2 h-4 w-4" />
                          Resetuj hasło
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={showArchived ? "default" : "destructive"}
                        onClick={() => setArchiveUserId(user.id)}
                      >
                        {showArchived ? (
                          <>
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Przywróć
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4" />
                            Archiwizuj
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!resetUserId} onOpenChange={() => setResetUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetuj hasło użytkownika</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz wysłać email z linkiem do resetowania hasła? Użytkownik otrzyma
              wiadomość email z instrukcjami.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => resetUserId && handleResetPassword(resetUserId)}>
              Wyślij email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!archiveUserId} onOpenChange={() => setArchiveUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showArchived ? "Przywróć użytkownika" : "Archiwizuj użytkownika"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showArchived
                ? "Czy na pewno chcesz przywrócić tego użytkownika? Będzie mógł ponownie logować się do systemu."
                : "Czy na pewno chcesz zarchiwizować tego użytkownika? Nie będzie mógł logować się do systemu."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                archiveUserId && handleArchiveUser(archiveUserId, !showArchived)
              }
            >
              {showArchived ? "Przywróć" : "Archiwizuj"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
