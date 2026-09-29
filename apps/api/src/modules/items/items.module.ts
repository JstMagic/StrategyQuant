import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { DatabaseService } from '../../common/database.service';
@Module({ controllers: [ItemsController], providers: [ItemsService, DatabaseService] })
export class ItemsModule {}
