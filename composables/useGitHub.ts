export const useGitHub = () => {
  const config = useRuntimeConfig()

  return {
    githubAppUrl: `https://github.com/apps/${config.github.appSlug}/installations/new`
  }
}
