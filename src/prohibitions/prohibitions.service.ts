import { Injectable } from '@nestjs/common';
import BaseService from 'src/base.service';
import Prohibition from './prohibition.entity';

@Injectable()
export class ProhibitionsService extends BaseService<Prohibition> {}
