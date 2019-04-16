export const emailConstraints = {
  presence: true,
  email: true
}

export const hashPasswordConstraints = {
  presence: true,
  length: {
    is: 64,
    message: "length must be 64"
  }
}
