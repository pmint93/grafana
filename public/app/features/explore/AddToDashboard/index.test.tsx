import React, { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from 'app/store/configureStore';
import { ExploreId, ExploreState } from 'app/types';
import { Provider } from 'react-redux';
import { AddToDashboard } from '.';
import * as api from './addToDashboard';
import { locationService, setEchoSrv } from '@grafana/runtime';
import * as initDashboard from 'app/features/dashboard/state/initDashboard';
import { DataQuery } from '@grafana/data';
import { createEmptyQueryResponse } from '../state/utils';
import { backendSrv } from 'app/core/services/backend_srv';
import { DashboardSearchItemType } from 'app/features/search/types';
import { Echo } from 'app/core/services/echo/Echo';

const setup = (children: ReactNode, queries: DataQuery[] = [{ refId: 'A' }]) => {
  const store = configureStore({
    explore: {
      left: {
        queries,
        queryResponse: createEmptyQueryResponse(),
      },
    } as ExploreState,
  });

  return render(<Provider store={store}>{children}</Provider>);
};

const openModal = async () => {
  userEvent.click(screen.getByRole('button', { name: /add to dashboard/i }));

  expect(await screen.findByRole('dialog', { name: 'Add panel to dashboard' })).toBeInTheDocument();
};

describe('AddToDashboardButton', () => {
  beforeAll(() => {
    setEchoSrv(new Echo());
  });

  it('Is disabled if explore pane has no queries', async () => {
    setup(<AddToDashboard exploreId={ExploreId.left} />, []);

    const button = await screen.findByRole('button', { name: /add to dashboard/i });
    expect(button).toBeDisabled();

    userEvent.click(button);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('Success path', () => {
    const addToDashboardResponse = Promise.resolve();

    const waitForAddToDashboardResponse = async () => {
      return act(async () => {
        await addToDashboardResponse;
      });
    };

    beforeEach(() => {
      jest.spyOn(api, 'setDashboardInLocalStorage').mockReturnValue(addToDashboardResponse);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Opens and closes the modal correctly', async () => {
      setup(<AddToDashboard exploreId={ExploreId.left} />);

      await openModal();

      userEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    describe('navigation', () => {
      it('Navigates to dashboard when clicking on "Open"', async () => {
        // @ts-expect-error global.open should return a Window, but is not implemented in js-dom.
        const openSpy = jest.spyOn(global, 'open').mockReturnValue(true);
        const pushSpy = jest.spyOn(locationService, 'push');

        setup(<AddToDashboard exploreId={ExploreId.left} />);

        await openModal();

        userEvent.click(screen.getByRole('button', { name: /open$/i }));

        await waitForAddToDashboardResponse();

        expect(screen.queryByRole('dialog', { name: 'Add panel to dashboard' })).not.toBeInTheDocument();

        expect(pushSpy).toHaveBeenCalled();
        expect(openSpy).not.toHaveBeenCalled();
      });

      it('Navigates to dashboard in a new tab when clicking on "Open in a new tab"', async () => {
        // @ts-expect-error global.open should return a Window, but is not implemented in js-dom.
        const openSpy = jest.spyOn(global, 'open').mockReturnValue(true);
        const pushSpy = jest.spyOn(locationService, 'push');

        setup(<AddToDashboard exploreId={ExploreId.left} />);

        await openModal();

        userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

        await waitForAddToDashboardResponse();

        expect(openSpy).toHaveBeenCalledWith(expect.anything(), '_blank');
        expect(pushSpy).not.toHaveBeenCalled();
      });
    });

    describe('Save to new dashboard', () => {
      describe('Navigate to correct dashboard when saving', () => {
        it('Opens the new dashboard in a new tab', async () => {
          // @ts-expect-error global.open should return a Window, but is not implemented in js-dom.
          const openSpy = jest.spyOn(global, 'open').mockReturnValue(true);

          setup(<AddToDashboard exploreId={ExploreId.left} />);

          await openModal();

          userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

          await waitForAddToDashboardResponse();

          expect(openSpy).toHaveBeenCalledWith('dashboard/new', '_blank');
        });

        it('Navigates to the new dashboard', async () => {
          const pushSpy = jest.spyOn(locationService, 'push');

          setup(<AddToDashboard exploreId={ExploreId.left} />);

          await openModal();

          userEvent.click(screen.getByRole('button', { name: /open$/i }));

          await waitForAddToDashboardResponse();

          expect(screen.queryByRole('dialog', { name: 'Add panel to dashboard' })).not.toBeInTheDocument();

          expect(pushSpy).toHaveBeenCalledWith('dashboard/new');
        });
      });
    });

    describe('Save to existing dashboard', () => {
      it('Renders the dashboard picker when switching to "Existing Dashboard"', async () => {
        setup(<AddToDashboard exploreId={ExploreId.left} />);

        await openModal();

        expect(screen.queryByRole('combobox', { name: /dashboard/ })).not.toBeInTheDocument();

        userEvent.click(screen.getByRole<HTMLInputElement>('radio', { name: /existing dashboard/i }));
        expect(screen.getByRole('combobox', { name: /dashboard/ })).toBeInTheDocument();
      });

      it('Does not submit if no dashboard is selected', async () => {
        locationService.push = jest.fn();

        setup(<AddToDashboard exploreId={ExploreId.left} />);

        await openModal();

        userEvent.click(screen.getByRole<HTMLInputElement>('radio', { name: /existing dashboard/i }));

        userEvent.click(screen.getByRole('button', { name: /open$/i }));
        await waitForAddToDashboardResponse();

        expect(locationService.push).not.toHaveBeenCalled();
      });

      describe('Navigate to correct dashboard when saving', () => {
        it('Opens the selected dashboard in a new tab', async () => {
          // @ts-expect-error global.open should return a Window, but is not implemented in js-dom.
          const openSpy = jest.spyOn(global, 'open').mockReturnValue(true);

          jest.spyOn(backendSrv, 'getDashboardByUid').mockResolvedValue({
            dashboard: { templating: { list: [] }, title: 'Dashboard Title', uid: 'someUid' },
            meta: {},
          });
          jest.spyOn(backendSrv, 'search').mockResolvedValue([
            {
              id: 1,
              uid: 'someUid',
              isStarred: false,
              items: [],
              title: 'Dashboard Title',
              tags: [],
              type: DashboardSearchItemType.DashDB,
              uri: 'someUri',
              url: 'someUrl',
            },
          ]);

          setup(<AddToDashboard exploreId={ExploreId.left} />);

          await openModal();

          userEvent.click(screen.getByRole('radio', { name: /existing dashboard/i }));

          userEvent.click(screen.getByRole('combobox', { name: /dashboard/i }));

          await waitFor(async () => {
            await screen.findByLabelText('Select option');
          });
          userEvent.click(screen.getByLabelText('Select option'));

          userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

          await waitFor(async () => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
          });

          expect(openSpy).toBeCalledWith('d/someUid', '_blank');
        });

        it('Navigates to the selected dashboard', async () => {
          const pushSpy = jest.spyOn(locationService, 'push');

          jest.spyOn(backendSrv, 'getDashboardByUid').mockResolvedValue({
            dashboard: { templating: { list: [] }, title: 'Dashboard Title', uid: 'someUid' },
            meta: {},
          });
          jest.spyOn(backendSrv, 'search').mockResolvedValue([
            {
              id: 1,
              uid: 'someUid',
              isStarred: false,
              items: [],
              title: 'Dashboard Title',
              tags: [],
              type: DashboardSearchItemType.DashDB,
              uri: 'someUri',
              url: 'someUrl',
            },
          ]);

          setup(<AddToDashboard exploreId={ExploreId.left} />);

          await openModal();

          userEvent.click(screen.getByRole('radio', { name: /existing dashboard/i }));

          userEvent.click(screen.getByRole('combobox', { name: /dashboard/i }));

          await waitFor(async () => {
            await screen.findByLabelText('Select option');
          });
          userEvent.click(screen.getByLabelText('Select option'));

          userEvent.click(screen.getByRole('button', { name: /open$/i }));

          await waitFor(async () => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
          });

          expect(pushSpy).toBeCalledWith('d/someUid');
        });
      });
    });
  });

  describe('Error handling', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Shows an error if opening a new tab fails', async () => {
      jest.spyOn(global, 'open').mockReturnValue(null);
      const removeDashboardSpy = jest.spyOn(initDashboard, 'removeDashboardToFetchFromLocalStorage');

      setup(<AddToDashboard exploreId={ExploreId.left} />);

      await openModal();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

      await waitFor(async () => {
        expect(await screen.findByRole('alert')).toBeInTheDocument();
      });

      expect(removeDashboardSpy).toHaveBeenCalled();
    });

    it('Shows an error if saving to localStorage fails', async () => {
      jest.spyOn(initDashboard, 'setDashboardToFetchFromLocalStorage').mockImplementation(() => {
        throw 'SOME ERROR';
      });

      setup(<AddToDashboard exploreId={ExploreId.left} />);

      await openModal();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

      await waitFor(async () => {
        expect(await screen.findByRole('alert')).toBeInTheDocument();
      });
    });

    it('Shows an error if fetching dashboard fails', async () => {
      jest.spyOn(backendSrv, 'getDashboardByUid').mockRejectedValue('SOME ERROR');
      jest.spyOn(backendSrv, 'search').mockResolvedValue([
        {
          id: 1,
          uid: 'someUid',
          isStarred: false,
          items: [],
          title: 'Dashboard Title',
          tags: [],
          type: DashboardSearchItemType.DashDB,
          uri: 'someUri',
          url: 'someUrl',
        },
      ]);

      setup(<AddToDashboard exploreId={ExploreId.left} />);

      await openModal();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('radio', { name: /existing dashboard/i }));

      userEvent.click(screen.getByRole('combobox', { name: /dashboard/i }));

      await waitFor(async () => {
        await screen.findByLabelText('Select option');
      });
      userEvent.click(screen.getByLabelText('Select option'));

      userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

      await waitFor(async () => {
        expect(await screen.findByRole('alert')).toBeInTheDocument();
      });
    });

    it('Shows an error if an unknown error happens', async () => {
      jest.spyOn(api, 'setDashboardInLocalStorage').mockRejectedValue('SOME ERROR');

      setup(<AddToDashboard exploreId={ExploreId.left} />);

      await openModal();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      userEvent.click(screen.getByRole('button', { name: /open in new tab/i }));

      await waitFor(async () => {
        expect(await screen.findByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
