import { useRouter } from 'next/router';
import { signOut as nextAuthSignOut } from 'next-auth/react';

export function useCustomSignOut() {
  const router = useRouter();

  const signOut = async () => {
    try {
      // Primero, llamamos a nuestra API custom para limpiar la sesión en el servidor
      const response = await fetch('/api/auth/custom-signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Signout failed');
      }

      // Después, usamos la función signOut de NextAuth para limpiar el estado del cliente
      await nextAuthSignOut({ redirect: false });

      // Finalmente, redirigimos manualmente al usuario
      router.push('/auth/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Si hay un error, intentamos hacer el signOut de NextAuth de todos modos
      await nextAuthSignOut({ redirect: false });
      router.push('/auth/login');
    }
  };

  return signOut;
}
