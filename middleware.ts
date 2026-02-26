import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // API エンドポイントは認証不要
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Basic認証のチェック
  const basicAuth = request.headers.get('authorization')
  const url = request.nextUrl

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, password] = atob(authValue).split(':')

    const validUser = process.env.DASHBOARD_USERNAME
    const validPassword = process.env.DASHBOARD_PASSWORD

    if (user === validUser && password === validPassword) {
      return NextResponse.next()
    }
  }

  // 認証失敗 - Basic認証を要求
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Bot Monitor Dashboard"',
    },
  })
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
}
