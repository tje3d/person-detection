import { get } from 'svelte/store'
import { easyToGregorian } from '../helpers/util'
import Form from '../models/Form'
import { ApiRequest, ApiRequestMethods } from './ApiRequest'

export default class RequestWidgetForm extends ApiRequest {
  url: string

  method: ApiRequestMethods

  constructor(public form: Form) {
    super()

    this.method = this.form.finalMethod
    this.url = form.finalUrl
  }

  get url_with_query() {
    if (this.method !== 'GET') {
      return this.url
    }

    const params = new URLSearchParams()

    for (const key in this.form.prependData) {
      params.set(key, this.form.prependData[key])
    }

    get(this.form.fields)
      .flat()
      .filter((f) => !!get(f.display))
      .filter((f) => {
        if (f.type === 'text') {
          return get(f.model) !== ''
        }

        return true
      })
      .forEach((f) => {
        // Convert stuff here
        switch (f.type) {
          case 'date':
            params.set(f.name, easyToGregorian(get(f.model)))
            break

          default:
            params.set(f.name, get(f.model))
            break
        }
      })

    return `${this.url}?${params.toString()}`
  }

  async form_body(): Promise<FormData | URLSearchParams> {
    const output =
      get(this.form.enctype) === 'multipart/form-data'
        ? new FormData()
        : new URLSearchParams()

    for (const key in this.form.prependData) {
      output.set(key, this.form.prependData[key])
    }

    get(this.form.fields)
      .flat()
      .filter((f) => !!get(f.display))
      .forEach((f) => {
        // Convert stuff here
        switch (f.type) {
          case 'date':
            output.set(f.name, easyToGregorian(get(f.model)))
            break

          default:
            output.set(f.name, get(f.model))
            break
        }
      })

    return output
  }
}
