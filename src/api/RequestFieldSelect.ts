import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestFieldSelect extends ApiRequest {
  method: ApiRequestMethods = 'GET'
  url: string

  constructor(
    public input: {
      filter: string
      url: string
      filter_name: string
      page?: number
      top?: number
    },
  ) {
    super()

    this.url = this.input.url
  }

  get url_with_query() {
    const params = new URLSearchParams()

    params.set(this.input.filter_name, this.input.filter)
    params.set('page', this.input.page.toString(10))
    params.set('top', this.input.top.toString(10))

    return `${this.url}?${params.toString()}`
  }
}
