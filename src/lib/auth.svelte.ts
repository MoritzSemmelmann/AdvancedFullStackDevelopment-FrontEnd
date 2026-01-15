export const loggedInUser = $state({
  email: '',
  username: '',
  name: '',
  token: '',
  _id: ''
});

export function clearSession() {
  loggedInUser.email = '';
  loggedInUser.username = '';
  loggedInUser.name = '';
  loggedInUser.token = '';
  loggedInUser._id = '';
}
