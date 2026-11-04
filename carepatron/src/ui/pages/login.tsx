import { logo } from '../icons';
import { Document } from '../layout';

export const LoginPage = ({ next, email = '', error }: { next: string; email?: string; error?: string }) => (
  <Document title="Sign in">
    <div class="auth">
      <div class="auth-card">
        <div class="auth-brand">
          {logo(32)}
          <span>Carepatron</span>
          <span class="mock">Mock</span>
        </div>
        <h1>Sign in to your practice</h1>
        <p class="muted">Welcome back. Enter your details to continue.</p>
        {error && (
          <div class="alert" role="alert">
            {error}
          </div>
        )}
        <form class="form" method="post" action="/login">
          <input type="hidden" name="next" value={next} />
          <label class="label" for="email">
            Email
          </label>
          <input class="input" id="email" name="email" type="email" autocomplete="username" value={email} required autofocus={!email} />
          <label class="label" for="password">
            Password
          </label>
          <input class="input" id="password" name="password" type="password" autocomplete="current-password" required autofocus={!!email} />
          <button class="button primary block" type="submit">
            Sign in
          </button>
        </form>
      </div>
      <p class="auth-footer">A mock of Carepatron, for trying things out. Everyone in it is made up.</p>
    </div>
  </Document>
);
