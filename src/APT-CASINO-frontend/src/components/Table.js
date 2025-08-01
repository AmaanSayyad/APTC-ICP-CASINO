import GradientBgButton from "./GradientBgButton";
import GradientBorderButton from "./GradientBorderButton";
import polygon from "../../../../public/images/Polygon.png";

export const Table = () => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>ASSET</th>
          <th>PRICE</th>
          <th>WALLET BALANCE</th>
          <th>APY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <img src={polygon} width={10} height={10} alt="polygon" />
            MATIC (Mumbia testnet)
          </td>
          <td>$0.93</td>
          <td>0.22</td>
          <td>0.94%</td>
          <td className="flex">
            <GradientBorderButton>Withdraw</GradientBorderButton>
            <GradientBgButton>Deposit</GradientBgButton>
          </td>
        </tr>
      </tbody>
    </table>
  );
};
