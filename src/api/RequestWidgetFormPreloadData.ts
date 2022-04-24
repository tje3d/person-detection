import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestWidgetFormPreloadData extends ApiRequest {
  method: ApiRequestMethods = 'GET'

  constructor(public url: string) {
    super()
  }
}
