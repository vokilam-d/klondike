// import { Controller, Get, Injectable, Next, Param, Req, Res, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import {
//   Profile,
//   Strategy,
//   StrategyOptionWithRequest,
//   VerifyFunctionWithRequest,
// } from 'passport-google-oauth20';
// import { AuthService } from './AuthService';
//
// type AuthProvider = 'google' | 'facebook';
//
// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy) {
//   // Facebook strategy should be pretty much the same
//   constructor(auth: AuthService) {
//     super(
//       <StrategyOptionWithRequest>{
//         clientID: "foo",
//         clientSecret: "foo",
//         callbackURL: '<domain>/auth/google/callback',
//         passReqToCallback: true,
//       },
//       <VerifyFunctionWithRequest>(async (
//         req,     // express request object
//         access,  // access token from Google
//         refresh, // refresh token from Google
//         profile, // user profile, parsed by passport
//         done
//       ) => {
//         // transform the profile to your expected shape
//         const myProfile: AuthProfile
//
//         return auth
//           .handlePassportAuth(myProfile)
//           .then(result => done(null, result))
//           .catch(error => done(error));
//       })
//     );
//   }
// }
//
// @Controller('auth')
// export class AuthController {
//   constructor(private readonly auth: AuthService) {}
//
//   @Get(':provider(google|facebook)')
//   async handleOauthRequest(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Next() next: NextFunction,
//     @Param('provider') provider: AuthProvider
//   ) {
//     const params = {
//       session: false,
//       scope: ['<specify scope base on provider>'],
//       callbackURL: `<domain>/auth/${provider}/callback`,
//     };
//     authenticate(provider, params)(req, res, next);
//   }
//
//   @Get(':provider(google|facebook)/callback')
//   async handleOauthCallback(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Next() next: NextFunction,
//     @Param('provider') provider: AuthProvider
//   ) {
//     const params = {
//       session: false,
//       state: req.query.state,
//       callbackURL: `<domain>/auth/${provider}/callback`,
//     };
//
//     // We use callback here, but you can let passport do the redirect
//     // http://www.passportjs.org/docs/downloads/html/#custom-callback
//     authenticate(provider, params, (err, user) => {
//       if (err) return next(err);
//       if (!user) return next(new UnauthorizedException());
//
//       // I generate the JWT token myself and redirect the user,
//       // but you can make it more smart.
//       this.generateTokenAndRedirect(req, res, user);
//     })(req, res, next);
//   }
// }
//
// @Injectable()
// export class AuthService {
//   async handlePassportAuth(profile: AuthProfile) {
//     // Return the existing user, or create the user entity
//     // form profile returned by the OAuth provider
//     const user: User;
//
//     // Preform your business logic here
//
//     // Return the user instance
//     return user;
//   }
// }
//
// @Module({
//   controllers: [AuthController],
//   providers: [AuthService, GoogleStrategy, FacebookStrategy],
//   exports: [AuthService],
// })
// export class AuthModule {}
