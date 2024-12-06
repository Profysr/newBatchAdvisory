"use client";

import { useAppContext } from "@/context/AppContext";

const TableComponent = ({
  data,
  title,
  actionBtns,
  checkBoxOption = false,
  rowCondition = () => false,
  excludeColumns = [],
}) => {
  const { selectedRows, handleCheckboxChange } = useAppContext();

  const defaultExcludeColumns = ["id", "role"];
  const combinedExcludeColumns = [...defaultExcludeColumns, ...excludeColumns];

  return (
    <div
      className="w-fit max-w-[1080px] overflow-x-auto bg-transparent border border-black/20 rounded-sm"
      aria-label="Table"
    >
      <div className="px-6 py-2 flex flex-col justify-start items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div className="text-lg tracking-wide leading-relaxed text-center capitalize">
          {title}
        </div>
        {actionBtns && <div>{actionBtns}</div>}
      </div>

      <TableGrid
        data={data}
        selectedRows={selectedRows}
        onCheckboxChange={handleCheckboxChange}
        checkBoxOption={checkBoxOption}
        rowCondition={rowCondition} // Pass the row condition to TableGrid
        excludeColumns={combinedExcludeColumns} // Pass combined exclude columns to TableGrid
      />
    </div>
  );
};

export const TableGrid = ({
  data,
  onCheckboxChange,
  selectedRows,
  checkBoxOption,
  rowCondition,
  excludeColumns,
}) => {
  // console.log(data);

  const keys = data[0] ? Object.keys(data[0]) : [];

  // Filter the columns to exclude those present in excludeColumns
  const thead = keys.filter((key) => !excludeColumns.includes(key));

  return (
    <table className="min-w-full block overflow-x-auto" aria-label="TableGrid">
      <thead className="bg-slate-900">
        <tr>
          {checkBoxOption ? (
            <th scope="col" className="px-6 py-3 text-left">
              <div className="flex items-center gap-x-2">
                <span className="text-sm font-semibold capitalize leading-relaxed tracking-wide text-gray-400"></span>
              </div>
            </th>
          ) : (
            <th scope="col" className="px-6 py-3 text-left">
              <div className="flex items-center gap-x-2">
                <span className="text-sm font-semibold capitalize leading-relaxed tracking-wide text-gray-400">
                  No
                </span>
              </div>
            </th>
          )}

          {thead.map((item, idx) => (
            <th key={idx} scope="col" className="px-6 py-3 text-left">
              <div className="flex items-center gap-x-2">
                <span className="text-sm font-semibold capitalize leading-relaxed tracking-wide text-gray-400">
                  {item}
                </span>
              </div>
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-700" aria-label="TableGrid Body">
        {data.map((currRow, i) => (
          <Tr
            key={i}
            index={i + 1}
            data={currRow}
            onCheckboxChange={onCheckboxChange}
            isSelected={selectedRows.includes(currRow.id)}
            checkBoxOption={checkBoxOption}
            rowCondition={rowCondition} // Pass row condition to Tr component
            excludeColumns={excludeColumns} // Pass excludeColumns to Tr
          />
        ))}
      </tbody>
    </table>
  );
};

export const Tr = ({
  index,
  data,
  onCheckboxChange,
  isSelected,
  checkBoxOption,
  rowCondition,
  excludeColumns,
}) => {
  const isRowFailed = rowCondition(data);

  const rowClass = isRowFailed ? "bg-yellow-200" : "bg-transparent";

  return (
    <tr className={rowClass} aria-label="Table Row">
      {checkBoxOption ? (
        <td className="px-6 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onCheckboxChange(data.id)}
            className="h-4 w-4 cursor-pointer  accent-green-600  border-gray-300 rounded focus:ring-green-500"
            aria-label={`Select row ${data.id}`}
          />
        </td>
      ) : (
        <td key={index} className="w-max whitespace-nowrap">
          <div className="px-6 py-3">
            <span className="block max-w-96 truncate text overflow-hidden text-sm font-semibold">
              {index}
            </span>
          </div>
        </td>
      )}

      {Object.entries(data)
        .filter(([key]) => !excludeColumns.includes(key)) // Exclude columns passed as props
        .map(([key, value], index) => (
          <td key={index} className="w-max">
            <div className="px-6 py-3">
              <span className="block max-w-80 truncate !whitespace-normal text overflow-hidden text-sm font-semibold">
                {Array.isArray(value)
                  ? value.join(", ") // Join array values with comma separator
                  : value !== null && value !== undefined && value !== ""
                  ? value
                  : "-"}
              </span>
            </div>
          </td>
        ))}
    </tr>
  );
};

export default TableComponent;
