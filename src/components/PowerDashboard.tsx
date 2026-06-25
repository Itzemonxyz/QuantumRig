import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Product } from '../types';

interface PowerDashboardProps {
  cartItems: (Product | undefined)[];
}

export default function PowerDashboard({ cartItems }: PowerDashboardProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const data = cartItems.filter(p => p !== undefined).map(p => {
      let estimate = 0;
      if (p?.wattage) {
        estimate = p.wattage;
      } else {
        const tdpString = p?.specs?.['TDP'] || p?.specs?.['Power Consumption'] || p?.specs?.['Maximum Power Draw'] || p?.specs?.['Wattage'];
        if (tdpString) {
          const match = String(tdpString).match(/(\d+)/);
          if (match) estimate = parseInt(match[1]);
        }
        if (!estimate) {
          const catList = ['c1', 'processors'].includes(p?.categoryId || '') ? 'cpu' :
                          ['c5', 'graphics-cards'].includes(p?.categoryId || '') ? 'gpu' :
                          ['c4', 'storage'].includes(p?.categoryId || '') ? 'storage' :
                          ['c3', 'ram'].includes(p?.categoryId || '') ? 'ram' :
                          ['c2', 'motherboards'].includes(p?.categoryId || '') ? 'mobo' :
                          ['c8', 'cooler'].includes(p?.categoryId || '') ? 'cooler' :
                          ['c7', 'case', 'casing'].includes(p?.categoryId || '') ? 'case' : '';
          
          if (catList === 'cpu') estimate = 125;
          else if (catList === 'gpu') estimate = 250;
          else if (catList === 'storage') estimate = 15;
          else if (catList === 'ram') estimate = 10;
          else if (catList === 'mobo') estimate = 40;
          else if (catList === 'cooler') estimate = 25;
          else if (catList === 'case') estimate = 15;
        }
      }
      return {
        id: p?.id,
        name: p?.title || 'Unknown',
        category: p?.categoryId || '',
        value: estimate || 1, // Minimum for rendering
      };
    }).filter(d => d.value > 0);

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    d3.select(svgRef.current).selectAll('*').remove();

    if (data.length === 0) {
      const svg = d3.select(svgRef.current)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
      
      svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .text('Add parts to see power usage');
      return;
    }

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6']);

    const pie = d3.pie<any>().value(d => d.value).sort(null);
    const arc = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius);
    const arcHover = d3.arc<any>().innerRadius(radius * 0.5).outerRadius(radius + 10);

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const arcs = svg.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    const totalWattage = d3.sum(data, d => d.value);

    // Center text total
    const centerText = svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em');
    
    centerText.append('tspan')
      .attr('x', 0)
      .attr('y', -5)
      .attr('font-size', '24px')
      .attr('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .text(`${totalWattage}W`);
      
    centerText.append('tspan')
      .attr('x', 0)
      .attr('y', 15)
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .text('Total Estimated');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.name) as string)
      .attr('stroke', 'currentColor')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .style('transition', 'all 0.3s ease')
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
          .style('opacity', 1);

        // Update center text to show part details
        centerText.selectAll('tspan').remove();
        centerText.append('tspan')
          .attr('x', 0)
          .attr('y', -5)
          .attr('font-size', '20px')
          .attr('font-weight', 'bold')
          .attr('fill', color(d.data.name) as string)
          .text(`${d.data.value}W`);
        centerText.append('tspan')
          .attr('x', 0)
          .attr('y', 15)
          .attr('font-size', '9px')
          .attr('fill', '#64748b')
          .style('max-width', '80px')
          .text(d.data.name.substring(0, 15) + '...');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('opacity', 0.8);
          
        centerText.selectAll('tspan').remove();
        centerText.append('tspan')
          .attr('x', 0)
          .attr('y', -5)
          .attr('font-size', '24px')
          .attr('font-weight', 'bold')
          .attr('fill', 'currentColor')
          .text(`${totalWattage}W`);
        centerText.append('tspan')
          .attr('x', 0)
          .attr('y', 15)
          .attr('font-size', '10px')
          .attr('fill', '#64748b')
          .text('Total Estimated');
      });

  }, [cartItems]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg ref={svgRef} className="w-full text-white dark:text-slate-900" style={{ maxHeight: '250px' }}></svg>
      {cartItems.filter(Boolean).length > 0 && (
        <div className="w-full mt-4 flex flex-wrap justify-center gap-2">
          {cartItems.filter(Boolean).map((p, i) => {
            const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];
            return (
            <div key={p!.id} className="flex items-center gap-1.5 text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
               <span 
                 className="w-2 h-2 rounded-full" 
                 style={{ backgroundColor: colors[i % colors.length] }}
               />
               <span className="truncate max-w-[80px] text-slate-600 dark:text-slate-300 font-medium" title={p!.title}>{p!.title}</span>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
