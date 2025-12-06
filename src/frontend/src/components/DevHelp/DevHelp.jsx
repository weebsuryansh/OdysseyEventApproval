import './DevHelp.scss'

function DevHelp() {
  return (
    <div className="panel info card-surface">
      <h2>Developer shortcuts</h2>
      <p>
        Use these sample accounts to exercise every stage without creating data manually. Each role will see their tailored dashboard
        after login. All default passwords follow the &lt;username&gt;123 convention.
      </p>
      <ul>
        <li>Student: student / student123</li>
        <li>SA Office: sa / sa123</li>
        <li>Faculty Coordinator: faculty / faculty123</li>
        <li>Dean: dean / dean123</li>
        <li>Admin: admin / admin123</li>
        <li>Dev: dev / dev123</li>
      </ul>
      <p className="hint">Sessions expire after 10 minutes of inactivity for safety.</p>
    </div>
  )
}

export default DevHelp
