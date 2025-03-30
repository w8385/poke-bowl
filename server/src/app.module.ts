import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PokemonModule } from './pokemon/pokemon.module';

@Module({
  controllers: [],
  imports: [ConfigModule.forRoot(), PokemonModule],
  providers: [],
})
export class AppModule {}
