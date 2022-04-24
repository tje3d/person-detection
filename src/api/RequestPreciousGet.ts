import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestPreciousGet extends ApiRequest {
  url = '/v1/precious'
  method: ApiRequestMethods = 'GET'

  constructor(
    public page?: number,
    public top?: number,
    public event_type?: 'lost' | 'found',
    public sort?: string,
    public similar_to?: number,
  ) {
    super()
  }

  get url_with_query() {
    const params = new URLSearchParams()

    if (this.page) {
      params.set('page', this.page.toString(10))
    }

    if (this.top) {
      params.set('top', this.top.toString(10))
    }

    if (this.event_type) {
      params.set('event_type', this.event_type)
    }

    if (this.sort) {
      params.set('sort', this.sort)
    }

    if (this.similar_to) {
      params.set('similar_to', this.similar_to.toString(10))
    }

    return `${this.url}?${params.toString()}`
  }
}
