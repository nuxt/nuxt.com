export const useJSON = () => {
  function parse (text: string) {
    return JSON.parse(text)
  }

  function stringify (value: any) {
    return JSON.stringify(value)
  }

  return {
    parse,
    stringify
  }
}
