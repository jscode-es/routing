import { useEffect } from 'react';
import { useRouter } from './hooks';

export interface RedirectProps {
  href: string;
}

// Guard declarativo: renderízalo en lugar del contenido protegido y hace
// replace (sin apilar historial) en cuanto se monta.
export function Redirect({ href }: RedirectProps): null {
  const router = useRouter();
  useEffect(() => {
    router.replace(href);
  }, [router, href]);
  return null;
}
