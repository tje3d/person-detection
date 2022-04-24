import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestRelation extends ApiRequest {
  url = '/v1/relation'
  method: ApiRequestMethods = 'POST'

  constructor(public first_id: number, public second_id: number) {
    super()
  }

  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //

  async form_body(): Promise<FormData | URLSearchParams> {
    const form = new URLSearchParams()

    form.set('first_id', this.first_id + '')
    form.set('second_id', this.second_id + '')

    return form
  }
}
