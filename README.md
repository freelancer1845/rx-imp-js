# JS/TS Implementation of Rx-Imp

## Example using rxjs websocket

* This only connects once and does not auto reconnect!

```typescript
import { Subject, Observable, of } from 'rxjs';
import { webSocket } from 'rxjs/webSocket';
import { RxImp } from '@freelancer1845/rx-imp-js';


export class RmiService {

  imp: RxImp;

  constructor() {

    let pdf = new FileReader();
    const test = new Subject();
    const subject = webSocket<any>({
      url: "ws://localhost:8080/rx",
      deserializer: (msg) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(msg.data);
        fileReader.onloadend = (ev) => test.next(fileReader.result);
      },
      serializer: msg => {
        return msg;
      }
    });
    subject.subscribe();
    this.imp = new RxImp(test as Observable<ArrayBuffer>, subject as Subject<ArrayBuffer>);
  }
}

const service = new RmiService();

service.imp.observableCall('stupidTarget', null).subscribe(console.log);
service.imp.registerCall('stupidTarget', arg => of(arg));



```