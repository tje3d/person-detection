export default class Popup {}

export class AlertPopup extends Popup {
  constructor(
    public title: string,
    public description: string,
    public btn_text: string,
  ) {
    super()
  }
}

export class ConfirmPopup extends Popup {
  constructor(
    public title: string,
    public description: string,
    public on_ok: Function,
    public on_cancel: Function,
    public ok_text: string,
    public cancel_text: string,
  ) {
    super()
  }
}
