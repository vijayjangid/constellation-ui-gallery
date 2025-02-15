import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  registerIcon,
  Modal,
  Flex,
  useModalManager,
  SummaryList,
  MetaList,
  Configuration,
  type SummaryListItem,
  type ModalMethods
} from '@pega/cosmos-react-core';
import * as polarisIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/polaris.icon';
import * as informationIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/information.icon';
import * as clipboardIcon from '@pega/cosmos-react-core/lib/components/Icon/icons/clipboard.icon';
import { renderObjectField } from './utils';

type UtilityListProps = {
  heading?: string;
  icon: 'information' | 'polaris' | 'clipboard';
  dataPage: string;
  setCaseID: boolean;
  primaryField: string;
  secondaryFields?: string;
  secondaryFieldTypes?: string;
  getPConnect: any;
};

/* To register more icon, you need to import them as shown above */
registerIcon(polarisIcon, informationIcon, clipboardIcon);

export default function PegaExtensionsUtilityList(props: UtilityListProps) {
  const {
    heading = 'List of objects',
    icon = 'clipboard',
    primaryField,
    secondaryFields = '',
    secondaryFieldTypes = '',
    dataPage = '',
    setCaseID = false,
    getPConnect
  } = props;
  const { create } = useModalManager();
  const [objects, setObjects] = useState<Array<SummaryListItem>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const viewAllModalRef = useRef<ModalMethods<any>>();

  const viewAllModal = () => {
    return (
      <Configuration>
        <Modal heading={heading} count={objects.length} progress={loading}>
          <SummaryList items={objects} />
        </Modal>
      </Configuration>
    );
  };

  const loadObjects = (data: Array<any>) => {
    const tmpObjects: Array<SummaryListItem> = [];
    const secondaryFieldTypesArray = secondaryFieldTypes.split(',');
    data.forEach((item: any) => {
      const primary = renderObjectField({
        propName: primaryField,
        type: 'string',
        item,
        getPConnect
      });
      const secondaryItems: Array<ReactNode> = [];
      secondaryFields.split(',').forEach((field, index) => {
        if (item[field]) {
          const val = renderObjectField({
            propName: field,
            type: secondaryFieldTypesArray[index]?.trim().toLocaleLowerCase() || '',
            item,
            getPConnect
          });
          if (val) {
            secondaryItems.push(val);
          }
        }
      });
      tmpObjects.push({
        id: item.pyID || item.pyLabel,
        primary,
        secondary: <MetaList items={secondaryItems} />
      });
    });
    setObjects(tmpObjects);
    setLoading(false);
  };

  useEffect(() => {
    if (dataPage) {
      const pConn = getPConnect();
      const CaseInstanceKey = pConn.getValue(
        (window as any).PCore.getConstants().CASE_INFO.CASE_INFO_ID
      );
      const payload = {
        dataViewParameters: [{ CaseInstanceKey }]
      };
      (window as any).PCore.getDataApiUtils()
        .getData(dataPage, setCaseID ? payload : {}, pConn.getContextName())
        .then((response: any) => {
          if (response.data.data !== null) {
            loadObjects(response.data.data);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [dataPage, primaryField, secondaryFields, secondaryFieldTypes]);

  if (!primaryField || !dataPage) return null;
  return (
    <Configuration>
      <Flex container={{ direction: 'column' }}>
        <SummaryList
          name={heading}
          headingTag='h3'
          icon={icon}
          count={loading ? undefined : objects.length}
          items={objects?.slice(0, 3)}
          loading={loading}
          noItemsText='No items'
          onViewAll={() => {
            viewAllModalRef.current = create(viewAllModal);
          }}
        />
      </Flex>
    </Configuration>
  );
}
