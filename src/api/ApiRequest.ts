import { Options } from 'ky'

export abstract class ApiRequest {
  options: Options

  abstract url: string
  abstract method: ApiRequestMethods

  abortController: AbortController = new AbortController()

  get url_with_query() {
    return this.url
  }

  async form_body(): Promise<FormData | URLSearchParams | undefined> {
    return undefined
  }
}

export type ApiRequestMethods = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE'
