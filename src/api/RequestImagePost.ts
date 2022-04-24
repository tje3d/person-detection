import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestImagePost extends ApiRequest {
  url = '/v1/image'
  method: ApiRequestMethods = 'POST'

  constructor(public image: File) {
    super()
  }

  async form_body(): Promise<FormData | URLSearchParams> {
    const form = new FormData()

    form.set('image', this.image)

    return form
  }
}
