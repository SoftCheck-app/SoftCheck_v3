import type { GetServerSidePropsContext } from 'next';

export async function getServerSideProps({
  locale,
  params,
}: GetServerSidePropsContext) {
  const { slug } = params as { slug: string };
  
  // Redirect to agent page immediately
  return {
    redirect: {
      destination: `/teams/${slug}/agent`,
      permanent: false,
    },
  };
}

// This page only serves as a redirect, no component needed
export default function Settings() {
  return null;
}
