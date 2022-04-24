import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestWidgetDatatable extends ApiRequest {
  method: ApiRequestMethods = 'GET'

  constructor(
    public url: string,
    public search: string,
    public page: number,
    public per_page: number,
    public additional_data?: object,
  ) {
    super()
  }

  get url_with_query() {
    const params = new URLSearchParams()
    const has_search = !!this.url.match(/\?/)

    params.set('search', this.search)
    params.set('page', this.page.toString())
    params.set('top', this.per_page.toString())

    if (this.additional_data) {
      for (const key in this.additional_data) {
        params.set(key, this.additional_data[key])
      }
    }

    if (has_search) {
      return `${this.url}&${params.toString()}`
    }

    return `${this.url}?${params.toString()}`
  }
}

export class RequestWidgetDatatableActionDelete extends ApiRequest {
  method: ApiRequestMethods = 'DELETE'

  constructor(public url: string) {
    super()
  }
}
