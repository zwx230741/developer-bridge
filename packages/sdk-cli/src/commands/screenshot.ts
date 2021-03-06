import * as path from 'path';

import dateformat from 'dateformat';
import untildify from 'untildify';
import vorpal from 'vorpal';

import HostConnections from '../models/HostConnections';
import captureScreenshot from '../models/captureScreenshot';

export default function screenshot(
  stores: {
    hostConnections: HostConnections,
  },
) {
  return (cli: vorpal) => {
    cli.command('screenshot [path]', 'Capture a screenshot from the connected device')
      .types({ string: ['path'] })
      .action(async (args: vorpal.Args & { path?: string }) => {
        const { appHost } = stores.hostConnections;
        if (!appHost) {
          cli.activeCommand.log('Not connected to a device');
          return false;
        }

        const destPath = path.resolve(
          args.path
            ? untildify(args.path)
            : dateformat('"Screenshot" yyyy-mm-dd "at" H.MM.ss."png"'),
        );

        try {
          await captureScreenshot(appHost.host, destPath, {
            onWrite(received, total) {
              cli.ui.redraw(
                total == null
                  ? 'Downloading...'
                  : `Downloading: ${Math.round(received / total * 100)}% completed`,
              );
            },
          });
          cli.ui.redraw(`Screenshot saved to ${destPath}`);
          return true;
        } catch (ex) {
          cli.ui.redraw(String(ex));
          return false;
        } finally {
          cli.ui.redraw.done();
        }
      });
  };
}
