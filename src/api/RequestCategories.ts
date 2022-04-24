import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestCategories extends ApiRequest {
  url = '/v1/categories'
  method: ApiRequestMethods = 'GET'
}
