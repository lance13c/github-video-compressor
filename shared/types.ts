export type Message = {
  type: 'text' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/webm' | 'video/quicktime',
  progress: number, // 0-1
  data: string, // Files will be in binary chunks
}
