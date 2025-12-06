import './Banner.scss'

function Banner({ status }) {
  if (!status?.text) return null
  return <div className={`banner ${status.type}`}>{status.text}</div>
}

export default Banner
