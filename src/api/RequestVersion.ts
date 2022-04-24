import { ApiRequest, ApiRequestMethods } from './ApiRequest'
import { ApiResponse } from './ApiResponse'

export default class RequestVersion extends ApiRequest {
  url = '/v1/version'
  method: ApiRequestMethods = 'GET'
}

export class ResponseVersion extends ApiResponse {
  /**
   * Check if we are authorized successfully
   */
  isSuccess() {
    return this.res.status === 200
  }

  /**
   * Return response as a object
   */
  async version(): Promise<string> {
    const res = await this.res.json()

    return res.version
  }
}
