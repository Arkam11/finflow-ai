import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { env } from './env';
import { findOrCreateOAuthUser } from '../services/auth.service';
import { AppDataSource } from './database';
import { User } from '../entities/User';
import { JwtPayload } from '../types/auth.types';

export const configurePassport = (): void => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const user = await findOrCreateOAuthUser({
            providerId: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            provider: 'google',
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );

  passport.use(
    new GitHubStrategy(
      {
        clientID: env.github.clientId,
        clientSecret: env.github.clientSecret,
        callbackURL: env.github.callbackUrl,
        scope: ['user:email'],
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: {
          id: string;
          displayName: string;
          emails?: { value: string }[];
          photos?: { value: string }[];
        },
        done: (error: Error | null, user?: User) => void,
      ) => {
        try {
          const user = await findOrCreateOAuthUser({
            providerId: profile.id,
            email: profile.emails?.[0]?.value || '',
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
            provider: 'github',
          });
          done(null, user);
        } catch (error) {
          done(error as Error);
        }
      },
    ),
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: env.jwt.accessSecret,
      },
      async (payload: JwtPayload, done) => {
        try {
          const repo = AppDataSource.getRepository(User);
          const user = await repo.findOne({ where: { id: payload.sub } });
          if (!user || !user.isActive) return done(null, false);
          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
};
