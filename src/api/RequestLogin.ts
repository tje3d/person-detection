import User from '../models/User'
import { ApiRequest, ApiRequestMethods } from './ApiRequest'
import { ApiResponse } from './ApiResponse'

export default class RequestLogin extends ApiRequest {
  url = '/v1/login'
  method: ApiRequestMethods = 'POST'

  constructor(public email: string, public password: string) {
    super()
  }

  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //

  async form_body(): Promise<FormData | URLSearchParams> {
    const form = new URLSearchParams()

    form.set('email', this.email)
    form.set('password', this.password)

    return form
  }
}

export class ResponseLogin extends ApiResponse {
  /**
   * Check if we are authorized successfully
   */
  isSuccess() {
    return this.res.status === 200
  }

  /**
   * Check if user password is wrong, So we can show proper message
   */
  isUserPassWrong() {
    return this.res.status === 401
  }

  /**
   * Return response as a object
   */
  async user(): Promise<User> {
    const res = await this.res.json()

    return User.fromObject({
      access_token: res.access_token as string,
      token_type: res.token_type as string,
      expires_in: res.expires_in as number,
      id: res.id as number,
      display_name: res.display_name as string,
    })
  }
}
