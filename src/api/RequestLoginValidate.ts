import { ApiRequest, ApiRequestMethods } from './ApiRequest'
import { ApiResponse } from './ApiResponse'

export default class RequestLoginValidate extends ApiRequest {
  url = '/v1/login'
  method: ApiRequestMethods = 'GET'
}

export class ResponseLoginValidate extends ApiResponse {
  data: object

  async isOk() {
    this.data = this.data || (await this.res.json())

    if ('id' in this.data && this.data['id'] > 0) {
      return true
    }

    return false
  }

  async getDisplayName() {
    this.data = this.data || (await this.res.json())

    return this.data['display_name']
  }
}
