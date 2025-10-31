// src/app/components/dashboard/AddWidgetModal.js
'use client';
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon } from '@heroicons/react/24/outline';

// This is our "Widget Library"
// It defines all available widgets users can add.
const WIDGET_LIBRARY = [
  { 
    name: 'Statistic Card', 
    description: 'A single, important number (e.g., Total Users).',
    config: { component: 'StatCard', dataSource: 'ga4_total_users' } 
  },
  { 
    name: 'Sessions Line Chart', 
    description: 'A line chart of sessions over time.',
    config: { component: 'LineChart', dataSource: 'ga4_sessions' } 
  },
  // --- Add more widgets here as we build them ---
  // { 
  //   name: 'Total Sales', 
  //   description: 'Your total Shopify sales.',
  //   config: { component: 'StatCard', dataSource: 'shopify_total_sales' } 
  // },
];

export default function AddWidgetModal({ isOpen, onClose, onAddWidget }) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white p-6">
                  <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900">
                    Add a New Widget
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-500">
                    Select a widget from the library to add it to your dashboard.
                  </p>
                  
                  <ul role="list" className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {WIDGET_LIBRARY.map((widget, index) => (
                      <li key={index} className="col-span-1 rounded-lg bg-white shadow ring-1 ring-gray-900/5">
                        <div className="flex w-full items-center justify-between space-x-6 p-6">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{widget.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{widget.description}</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-200">
                          <div className="-mt-px flex divide-x divide-gray-200">
                            <div className="flex w-0 flex-1">
                              <button
                                onClick={() => onAddWidget(widget.config)}
                                className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-blue-600 hover:bg-gray-50"
                              >
                                <PlusIcon className="h-5 w-5" aria-hidden="true" />
                                Add to Dashboard
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}