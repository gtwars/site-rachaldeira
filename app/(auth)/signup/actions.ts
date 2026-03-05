'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function signUpAction(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const position = formData.get('position') as string;
    const age = formData.get('age') as string;
    const phone = formData.get('phone') as string;
    const photo = formData.get('photo') as File | null;

    try {
        const supabase = createAdminClient();

        // 0. Check if member email already exists
        const { data: existingMember } = await supabase
            .from('members')
            .select('id')
            .eq('email', email)
            .single();

        if (existingMember) {
            return { error: 'Este e-mail já está cadastrado como integrante.' };
        }

        // 1. Upload photo if exists
        let photo_url = null;
        if (photo && photo.size > 0) {
            try {
                const fileExt = photo.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('Fotos')
                    .upload(fileName, photo, {
                        contentType: photo.type,
                        upsert: true
                    });

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('Fotos')
                        .getPublicUrl(fileName);
                    photo_url = publicUrl;
                }
            } catch (storageError) {
                console.error('Storage error:', storageError);
            }
        }

        // 2. Create auth user with auto-confirm
        const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (signUpError) {
            console.error('Error creating user:', signUpError);
            // If the error message is the specific Supabase one, translate or clarify
            const msg = signUpError.message.includes('unexpected response')
                ? 'O servidor do Supabase retornou um erro inesperado (500). Verifique se a SERVICE_ROLE_KEY está correta no .env e se não há triggers conflitantes no banco.'
                : signUpError.message;
            return { error: 'Erro no Auth: ' + msg };
        }

        if (!authData.user) {
            return { error: 'Usuário criado, mas dados não retornados.' };
        }

        // 3. Create member
        const { data: memberData, error: memberError } = await supabase
            .from('members')
            .insert({
                name,
                email,
                age: parseInt(age) || 0,
                phone,
                position,
                photo_url
            })
            .select()
            .single();

        if (memberError) {
            console.error('Error creating member:', memberError);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: 'Erro ao criar integrante: ' + memberError.message };
        }

        // 4. Create/Link profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: authData.user.id,
                role: 'user',
                member_id: memberData.id
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            await supabase.from('members').delete().eq('id', memberData.id);
            await supabase.auth.admin.deleteUser(authData.user.id);
            return { error: 'Erro ao criar perfil: ' + profileError.message };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in signUpAction:', error);
        return { error: 'Erro inesperado: ' + (error.message || 'Contate o administrador.') };
    }
}
