
let token: string = '';

// TODO: Save token to local storage

export const setToken = (value: string) => {
  token = value;
}

export const getToken = () => token
