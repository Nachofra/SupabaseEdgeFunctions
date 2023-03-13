// type Invitation = {
//   id: string
//   code: string
//   team_id: string
//   expiration_date: Date
// }

class CustomError extends Error{
  statusCode;
  constructor(title: string, statusCode: number){
    super(title);
    this.statusCode = statusCode
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// export type { Invitation }
export { CustomError }