import { Body, Controller, Get, Post } from '@nestjs/common';
import { ItemsService, type Item } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(): Promise<Item[]> {
    return this.items.list();
  }

  @Post()
  create(@Body() dto: CreateItemDto): Promise<Item> {
    return this.items.create(dto);
  }
}
