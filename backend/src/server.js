import { createApp } from './createApp.js'

const port = Number(process.env.PORT || 4000)
const app = createApp()

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port}`)
})
