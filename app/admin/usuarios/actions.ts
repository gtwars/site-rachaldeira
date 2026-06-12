'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function linkUserToMember(userId: string, memberId: string | null) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, member_id: memberId }, { onConflict: 'id' });

    if (error) {
        console.error('Error linking user to member:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}

export async function deleteUserAndProfile(userId: string) {
    const supabase = createAdminClient();

    // Delete from profiles (should be cascade by DB, but good to be sure)
    // Note: profiles table in schema has ON DELETE CASCADE from auth.users

    // Delete from auth.users
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
        console.error('Error deleting user:', error);
        return { error: error.message };
    }

    revalidatePath('/admin/usuarios');
    return { success: true };
}
