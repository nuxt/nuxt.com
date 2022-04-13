export const useGitHub = () => {
  const config = useRuntimeConfig().public

  return {
    githubAppUrl: `https://github.com/apps/${config.github.appSlug}/installations/new`
  }
}
