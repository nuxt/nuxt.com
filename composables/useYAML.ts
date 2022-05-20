import yaml from 'js-yaml'

export const useYAML = () => {
  function parse (text: string) {
    return yaml.load(text)
  }

  function stringify (value: any) {
    return yaml.dump(value)
  }

  return {
    parse,
    stringify
  }
}
