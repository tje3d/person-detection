export function get_grid_col(num: number) {
  switch (num) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-2'
    case 3:
      return 'grid-cols-3'
    case 4:
      return 'grid-cols-4'
    case 5:
      return 'grid-cols-5'
    case 6:
      return 'grid-cols-6'
    case 7:
      return 'grid-cols-7'
    case 8:
      return 'grid-cols-8'
    case 9:
      return 'grid-cols-9'
    case 10:
      return 'grid-cols-10'
    case 11:
      return 'grid-cols-11'
    case 12:
      return 'grid-cols-12'
    case 0:
    default:
      return 'grid-cols-none'
  }
}

export function throwIfEmpty(value: any, label: string) {
  if (typeof value === 'undefined' || value === null || value === '') {
    throw new Error(`${label} can't be empty`)
  }
}

export function bytesToSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Byte'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
  return (bytes / Math.pow(1024, i)).toString().substr(0, 4) + '' + sizes[i]
}
